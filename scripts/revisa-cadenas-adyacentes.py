# -*- coding: utf-8 -*-
"""Caza la concatenación de cadenas ESTILO PYTHON en archivos .ts y .tsx.

   En Python dos literales seguidos se pegan solos:

       texto = 'hola '
               'mundo'

   En JavaScript eso es un ERROR DE SINTAXIS: hace falta el `+`. Y es un error
   que no avisa localmente —no hay Node en esta máquina— ni lo tapa
   `ignoreBuildErrors`, que solo cubre errores de TIPO. Tumba el despliegue de
   Vercel y punto.

   Pasó el 23 sep 2026 con el campo `diagnostico` de finsus-data.ts: seis
   líneas de literales adyacentes, escritas con la cabeza en Python. El
   revisor de JSX no lo veía porque solo mira comentarios mal puestos.

   QUÉ BUSCA
   ---------
   Una línea que TERMINA en un literal de cadena cerrado, seguida de otra que
   EMPIEZA con un literal de cadena, sin ningún operador entre ambas. Se
   ignoran los casos legítimos: arreglos y objetos —donde la coma separa—, y
   las líneas que ya traen `+`.

   USO
   ---
       python scripts/revisa-cadenas-adyacentes.py
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALTAR = {'node_modules', '.next', '.git', 'dist', 'build'}

# Una línea cuyo contenido útil TERMINA en cadena cerrada, sin coma ni operador.
FIN_CADENA = re.compile(r"""(?:'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")\s*$""")
# Una línea cuyo contenido útil EMPIEZA con una cadena.
INI_CADENA = re.compile(r"""^\s*(?:'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")""")


def revisa(ruta):
    lineas = io.open(ruta, encoding='utf-8').read().split('\n')
    fallos = []
    for i in range(len(lineas) - 1):
        a, b = lineas[i], lineas[i + 1]
        # Se limpia el comentario de fin de línea antes de juzgar.
        a_util = re.sub(r'//.*$', '', a).rstrip()
        b_util = b.rstrip()
        if not a_util or not b_util:
            continue
        # Casos legítimos: la coma separa elementos; el `+` ya concatena; y una
        # línea que abre algo no está terminando una expresión.
        if a_util.endswith((',', '+', '(', '[', '{', '=', '?', ':', ';', '&&', '||')):
            continue
        if b_util.lstrip().startswith(('+', ',', ')', ']', '}')):
            continue
        if not FIN_CADENA.search(a_util) or not INI_CADENA.match(b_util):
            continue
        # Dentro de un comentario de bloque no hay código que romper.
        antes = '\n'.join(lineas[:i + 1])
        if antes.count('/*') > antes.count('*/'):
            continue
        fallos.append((i + 1, a.strip()[:72], b.strip()[:72]))
    return fallos


total = 0
archivos = 0
for base, dirs, files in os.walk(RAIZ):
    dirs[:] = [d for d in dirs if d not in SALTAR]
    for f in files:
        if not f.endswith(('.ts', '.tsx')):
            continue
        archivos += 1
        ruta = os.path.join(base, f)
        for n, a, b in revisa(ruta):
            total += 1
            rel = os.path.relpath(ruta, RAIZ)
            print('  %s:%d  concatenación estilo Python — falta un «+»' % (rel, n))
            print('      %s' % a)
            print('   -> %s' % b)

print('\n  %d archivo(s) revisados.' % archivos)
if total:
    print('  *** %d caso(s): en JavaScript esto NO concatena, es error de sintaxis ***' % total)
    sys.exit(1)
print('  ninguna concatenación estilo Python.')
