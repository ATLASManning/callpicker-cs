# -*- coding: utf-8 -*-
"""Cadenas de comillas partidas en dos lineas dentro de archivos .ts.

   POR QUE EXISTE
   --------------
   En JavaScript una cadena de comillas simples o dobles NO puede abarcar dos
   lineas; solo las plantillas de acento grave pueden. Partir una es un error de
   SINTAXIS, y eso tumba el build — a diferencia de los errores de tipo, que
   `next.config.js` ignora a proposito.

   El 1 de octubre de 2026 costo un despliegue. Un script de edicion escribio el
   salto de linea REAL donde debia ir el escape, y el archivo quedo asi:

       `… ):\\n${grcLines.join('
       ')}`

   Vercel contesto «2 deployments failed» y las correcciones de esa tanda se
   quedaron sin publicar: yo verificaba contra produccion y seguia viendo el
   calculo viejo sin entender por que.

   POR QUE NO LO VIO NINGUN OTRO DETECTOR
   --------------------------------------
   `revisa-balance.py` cuenta llaves, parentesis y corchetes. Una comilla no es
   ninguna de las tres y el archivo seguia balanceado.

   DOS COSAS QUE ESTE GUION TUVO QUE APRENDER
   ------------------------------------------
   El primer intento daba 42 falsos positivos y encontraba los mismos 42 en el
   arbol roto y en el corregido — o sea que no servia para nada:

   1. SOLO .ts, NUNCA .tsx. En JSX un atributo `className="…"` SI puede abarcar
      varias lineas, porque no es una cadena de JavaScript. Revisarlos daba 40
      falsos positivos de una sola clase.
   2. HAY QUE ENTRAR EN `${…}`. Dentro de una plantilla el primer intento se
      saltaba todo hasta el acento grave de cierre, y el error vivia justamente
      dentro de una interpolacion. Ahora la interpolacion se recorre como
      expresion normal, anidada.

   Y los literales de expresion regular se reconocen, porque `/[",;\\n]/` lleva
   una comilla dentro y no es el principio de ninguna cadena.

   USO
   ---
       python scripts/revisa-cadenas-rotas.py
"""
import glob
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Si el ultimo caracter con contenido antes de `/` es uno de estos, ese `/` abre
# una expresion regular y no es una division.
ANTES_DE_REGEX = set('(,=:[!&|?{};+-*%~^<>') | {''}


def revisa(texto):
    """Devuelve [(linea, comilla, contenido)] de cadenas sin cerrar.

       Un solo recorrido por todo el archivo, con una pila para las plantillas:
       `a ${ `b ${ c }` }` anida, y hay que poder volver al nivel de afuera.
    """
    fallos = []
    i, n = 0, len(texto)
    linea = 1
    pila = []          # 'plantilla' por cada acento grave abierto
    interp = 0         # profundidad de ${ } dentro de la plantilla actual
    ultimo = ''        # ultimo caracter con contenido, para el heuristico de regex

    while i < n:
        c = texto[i]

        if c == '\n':
            linea += 1
            i += 1
            continue

        # ── comentarios ────────────────────────────────────────────────────
        if c == '/' and i + 1 < n and texto[i + 1] == '/':
            while i < n and texto[i] != '\n':
                i += 1
            continue
        if c == '/' and i + 1 < n and texto[i + 1] == '*':
            i += 2
            while i + 1 < n and not (texto[i] == '*' and texto[i + 1] == '/'):
                if texto[i] == '\n':
                    linea += 1
                i += 1
            i += 2
            continue

        # ── expresion regular ──────────────────────────────────────────────
        if c == '/' and ultimo in ANTES_DE_REGEX:
            j = i + 1
            cerrada = False
            while j < n and texto[j] != '\n':
                if texto[j] == '\\':
                    j += 2
                    continue
                if texto[j] == '[':                       # clase: / no cierra
                    while j < n and texto[j] not in ']\n':
                        j += 2 if texto[j] == '\\' else 1
                if texto[j] == '/':
                    cerrada = True
                    break
                j += 1
            if cerrada:
                i = j + 1
                ultimo = '/'
                continue
            # No cerraba en la linea: era una division.

        # ── plantillas ─────────────────────────────────────────────────────
        if c == '`':
            if pila and interp == 0:
                pila.pop()
            else:
                pila.append('plantilla')
            i += 1
            ultimo = '`'
            continue

        if pila and interp == 0:
            # Texto llano de plantilla: puede tener saltos de linea, y solo
            # `${` o el acento grave de cierre lo interrumpen.
            if c == '\\':
                i += 2
                continue
            if c == '$' and i + 1 < n and texto[i + 1] == '{':
                interp += 1
                i += 2
                continue
            i += 1
            continue

        if pila and interp > 0:
            if c == '{':
                interp += 1
            elif c == '}':
                interp -= 1

        # ── cadenas de comillas ────────────────────────────────────────────
        if c in ('"', "'"):
            j = i + 1
            while j < n and texto[j] not in (c, '\n'):
                j += 2 if texto[j] == '\\' else 1
            if j >= n or texto[j] == '\n':
                inicio = texto.rfind('\n', 0, i) + 1
                fin = texto.find('\n', i)
                fallos.append((linea, c, texto[inicio:fin if fin > 0 else n].strip()[:96]))
                i = j
                continue
            i = j + 1
            ultimo = c
            continue

        if not c.isspace():
            ultimo = c
        i += 1

    return fallos


def main():
    # Solo .ts: en .tsx un atributo JSX puede abarcar varias lineas con comillas
    # y no es una cadena de JavaScript.
    archivos = []
    for carpeta in ('app', 'lib'):
        archivos += glob.glob(os.path.join(RAIZ, carpeta, '**', '*.ts'), recursive=True)
    archivos += glob.glob(os.path.join(RAIZ, 'components', '**', '*.ts'), recursive=True)

    hallazgos = []
    for arch in sorted(set(archivos)):
        rel = os.path.relpath(arch, RAIZ).replace('\\', '/')
        for linea, comilla, texto in revisa(io.open(arch, encoding='utf-8-sig').read()):
            hallazgos.append((rel, linea, comilla, texto))

    if not hallazgos:
        print('%d archivo(s) .ts revisados, ninguna cadena partida en dos lineas.'
              % len(set(archivos)))
        return 0

    print('%d cadena(s) de comillas sin cerrar en su linea:\n' % len(hallazgos))
    for rel, linea, comilla, texto in hallazgos:
        print('  %s:%d  — comilla %s' % (rel, linea, comilla))
        print('      %s' % texto)
    print('\nUna cadena de comillas no puede abarcar dos lineas: es error de sintaxis')
    print('y tumba el build. Usar el escape \\n, o un acento grave.')
    return 1


if __name__ == '__main__':
    sys.exit(main())
