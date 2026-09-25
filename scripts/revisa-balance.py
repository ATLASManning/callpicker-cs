# -*- coding: utf-8 -*-
"""Comprueba que llaves, parentesis y corchetes cierran, y que no queda ninguna
   cadena ni comentario sin cerrar.

   POR QUE EXISTE
   --------------
   Sin Node no hay parser. Un `}` de menos en un archivo de 1,800 lineas tumba el
   build de Vercel y no hay forma de saberlo antes de desplegar. Los otros
   detectores no lo ven: revisa-jsx.py mira comentarios JSX, revisa-imports.py
   mira modulos, revisa-zona-muerta.py mira el orden.

   POR QUE UN CONTADOR A PELO NO SIRVE
   -----------------------------------
   Ya lo intente con un regex y dio 37 falsos positivos: contaba las llaves que
   viven DENTRO de cadenas y comentarios. Para que esto valga hay que tokenizar
   de verdad:
     - comentarios // y las lineas que abren con un `*` de un bloque
     - bloques comentario
     - cadenas '...' y "..." con escapes
     - plantillas `...` con interpolaciones ${...} ANIDADAS, que pueden contener
       a su vez cadenas y mas plantillas
     - expresiones regulares /.../ , que llevan llaves y corchetes literales y
       son lo mas dificil de distinguir de una division

   Lo que NO hace: entender JSX. No hace falta: las llaves de JSX tambien tienen
   que cerrar, asi que el balance global sigue valiendo.

   USO
   ---
       python scripts/revisa-balance.py
       python scripts/revisa-balance.py --cambiados
       python scripts/revisa-balance.py app/tickets/page.tsx
"""
import io
import os
import subprocess
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IGNORA = {'node_modules', '.next', '.git', 'supabase', 'out', 'dist'}
EXTS = ('.ts', '.tsx', '.js', '.mjs')

PAREJA = {')': '(', ']': '[', '}': '{'}
ABRE = set('([{')

# Un `/` que viene DESPUES de uno de estos es el inicio de una regex, no una
# division.
#
# OJO: `{` y `}` NO estan en la lista, a proposito. En JS puro un `}` puede
# preceder a una regex (`if (x) {} /re/.test(y)`), pero en un archivo .tsx el
# `/>` que cierra una etiqueta JSX viene detras de `}` a cada rato
# (`<Ticket size={10} />`). Tratarlo como regex hacia que el tokenizador se
# comiera media linea y acusara de desbalance a codigo correcto: fue el primer
# falso positivo que dio este detector.
ANTES_DE_REGEX = set('(,=:[!&|?;+-*%~^') | {''}

# Detras de una de estas palabras, un `/` TAMBIEN abre una regex: `return /re/`,
# `typeof /re/`, `case /re/`. El ultimo caracter significativo seria una letra,
# asi que la heuristica de caracteres sola las daba por division — y entonces un
# `"` dentro de la clase de caracteres abria una cadena y arrastraba el resto del
# archivo. Fue el tercer falso positivo de este detector, y salio de
# `return /[",;\n]/.test(s)` en app/facturacion/page.tsx.
PALABRAS_ANTES_DE_REGEX = {
    'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void',
    'case', 'do', 'else', 'yield', 'await', 'throw',
}


def analiza(src):
    """Devuelve (errores, pila_sobrante). Cada error es (linea, col, texto)."""
    errores = []
    pila = []                      # [(char, linea, col)]
    i, n = 0, len(src)
    linea, col = 1, 1
    ultimo_signo = ''              # ultimo caracter significativo
    # Pila de contextos de plantilla: cuantas llaves abiertas dentro de un ${}
    plantillas = []

    def avanza(c):
        nonlocal linea, col
        if c == '\n':
            linea += 1
            col = 1
        else:
            col += 1

    while i < n:
        c = src[i]

        # ── comentario de linea ──
        if c == '/' and i + 1 < n and src[i + 1] == '/':
            while i < n and src[i] != '\n':
                avanza(src[i])
                i += 1
            continue

        # ── comentario de bloque ──
        if c == '/' and i + 1 < n and src[i + 1] == '*':
            ini = (linea, col)
            i += 2
            avanza('/')
            avanza('*')
            cerrado = False
            while i < n:
                if src[i] == '*' and i + 1 < n and src[i + 1] == '/':
                    avanza('*')
                    avanza('/')
                    i += 2
                    cerrado = True
                    break
                avanza(src[i])
                i += 1
            if not cerrado:
                errores.append((ini[0], ini[1], 'comentario /* sin cerrar'))
            continue

        # ── cadena simple o doble ──
        #
        # La cadena SI puede cruzar lineas, a proposito: en JSX un atributo como
        # `className="a\n  b"` es legal y se parte en varias lineas a cada rato.
        # Cortarla en el salto de linea hacia que el tokenizador acusara de
        # "cadena sin cerrar" a codigo correcto — el segundo falso positivo de
        # este detector. Aqui solo interesa TAPAR las llaves de dentro; una
        # cadena de verdad sin cerrar se delata igual al llegar al final del
        # archivo o por el desbalance que provoca.
        if c in '"\'':
            q = c
            ini = (linea, col)
            avanza(c)
            i += 1
            cerrado = False
            while i < n:
                if src[i] == '\\':
                    avanza(src[i]); i += 1
                    if i < n:
                        avanza(src[i]); i += 1
                    continue
                if src[i] == q:
                    avanza(src[i]); i += 1
                    cerrado = True
                    break
                avanza(src[i]); i += 1
            if not cerrado:
                errores.append((ini[0], ini[1], 'cadena %s abierta y nunca cerrada' % q))
            ultimo_signo = q
            continue

        # ── plantilla ──
        if c == '`':
            ini = (linea, col)
            avanza(c); i += 1
            cerrado = False
            while i < n:
                if src[i] == '\\':
                    avanza(src[i]); i += 1
                    if i < n:
                        avanza(src[i]); i += 1
                    continue
                if src[i] == '`':
                    avanza(src[i]); i += 1
                    cerrado = True
                    break
                if src[i] == '$' and i + 1 < n and src[i + 1] == '{':
                    # Interpolacion: se sale al flujo normal con un marcador, de
                    # modo que las cadenas y plantillas de dentro se tokenicen
                    # igual. Se recuerda el nivel para volver a la plantilla.
                    avanza(src[i]); i += 1
                    pila.append(('{', linea, col))
                    plantillas.append(len(pila))
                    avanza(src[i]); i += 1
                    cerrado = True     # la plantilla sigue tras el ${...}
                    break
                avanza(src[i]); i += 1
            if not cerrado:
                errores.append((ini[0], ini[1], 'plantilla ` sin cerrar'))
            ultimo_signo = '`'
            continue

        # ── expresion regular ──
        # `/>` cierra una etiqueta JSX, `//` ya se trato, `/ ` y `/=` son
        # division: ninguno abre una regex.
        siguiente = src[i + 1] if i + 1 < n else ''
        palabra_antes = ''
        if c == '/' and (ultimo_signo.isalpha() or ultimo_signo == '_'):
            k = i - 1
            while k >= 0 and src[k].isspace():
                k -= 1
            fin = k + 1
            while k >= 0 and (src[k].isalnum() or src[k] in '_$'):
                k -= 1
            palabra_antes = src[k + 1:fin]
        if (c == '/'
                and (ultimo_signo in ANTES_DE_REGEX
                     or palabra_antes in PALABRAS_ANTES_DE_REGEX)
                and siguiente not in ('>', '=', ' ', '\t', '\n', '')):
            j = i + 1
            l2, c2 = linea, col + 1
            dentro_clase = False
            cerrado = False
            while j < n:
                if src[j] == '\\':
                    j += 2; c2 += 2
                    continue
                if src[j] == '\n':
                    break
                if src[j] == '[':
                    dentro_clase = True
                elif src[j] == ']':
                    dentro_clase = False
                elif src[j] == '/' and not dentro_clase:
                    cerrado = True
                    j += 1; c2 += 1
                    break
                j += 1; c2 += 1
            if cerrado:
                while i < j:
                    avanza(src[i]); i += 1
                # banderas
                while i < n and src[i].isalpha():
                    avanza(src[i]); i += 1
                ultimo_signo = '/'
                continue
            # no era regex: cae al tratamiento normal

        # ── parejas ──
        if c in ABRE:
            pila.append((c, linea, col))
            ultimo_signo = c
            avanza(c); i += 1
            continue
        if c in PAREJA:
            if not pila:
                errores.append((linea, col, 'cierra `%s` y no habia nada abierto' % c))
            else:
                ab, al, ac = pila[-1]
                if ab != PAREJA[c]:
                    errores.append((linea, col,
                                    'cierra `%s` pero lo abierto era `%s` de la linea %d' % (c, ab, al)))
                else:
                    pila.pop()
                    # Si esta `}` cerraba un ${...}, volvemos a la plantilla.
                    if plantillas and len(pila) + 1 == plantillas[-1]:
                        plantillas.pop()
                        # Reanuda la plantilla desde aqui.
                        avanza(c); i += 1
                        ini = (linea, col)
                        cerrado = False
                        while i < n:
                            if src[i] == '\\':
                                avanza(src[i]); i += 1
                                if i < n:
                                    avanza(src[i]); i += 1
                                continue
                            if src[i] == '`':
                                avanza(src[i]); i += 1
                                cerrado = True
                                break
                            if src[i] == '$' and i + 1 < n and src[i + 1] == '{':
                                avanza(src[i]); i += 1
                                pila.append(('{', linea, col))
                                plantillas.append(len(pila))
                                avanza(src[i]); i += 1
                                cerrado = True
                                break
                            avanza(src[i]); i += 1
                        if not cerrado:
                            errores.append((ini[0], ini[1], 'plantilla ` sin cerrar tras ${}'))
                        ultimo_signo = '`'
                        continue
            ultimo_signo = c
            avanza(c); i += 1
            continue

        if not c.isspace():
            ultimo_signo = c
        avanza(c)
        i += 1

    return errores, pila


def archivos(args):
    explicitos = [a for a in args if not a.startswith('--')]
    if explicitos:
        return [os.path.join(RAIZ, a) for a in explicitos]
    if '--cambiados' in args:
        r = subprocess.run(['git', 'status', '--porcelain'], cwd=RAIZ,
                           capture_output=True, text=True, timeout=30)
        out = []
        for ln in r.stdout.splitlines():
            p = ln[3:].strip().strip('"')
            if ' -> ' in p:
                p = p.split(' -> ')[-1]
            if p.endswith(EXTS):
                out.append(os.path.join(RAIZ, p))
        return out
    out = []
    for dp, dn, fn in os.walk(RAIZ):
        dn[:] = [d for d in dn if d not in IGNORA and not d.startswith('.')]
        for f in fn:
            if f.endswith(EXTS):
                out.append(os.path.join(dp, f))
    return out


def main():
    lista = [f for f in archivos(sys.argv[1:]) if os.path.isfile(f)]
    total = 0
    con_fallo = 0
    for ruta in sorted(lista):
        rel = os.path.relpath(ruta, RAIZ).replace('\\', '/')
        try:
            src = io.open(ruta, encoding='utf-8').read()
        except Exception as e:
            print('  *** %s: no se pudo leer (%s)' % (rel, e))
            con_fallo += 1
            continue
        total += 1
        errores, pila = analiza(src)
        if pila:
            for ab, al, ac in pila[:5]:
                errores.append((al, ac, 'abre `%s` y nunca se cierra' % ab))
        if errores:
            con_fallo += 1
            print('  *** %s' % rel)
            for l, c, txt in errores[:6]:
                print('      linea %d, col %d: %s' % (l, c, txt))
            if len(errores) > 6:
                print('      ... y %d mas' % (len(errores) - 6))
            print()

    print('  %d archivo(s) revisados.' % total)
    if con_fallo:
        print('  *** %d archivo(s) desbalanceados. Cada uno tumba el build.' % con_fallo)
        return 1
    print('  llaves, parentesis y corchetes cierran en todos.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
