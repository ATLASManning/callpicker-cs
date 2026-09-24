# -*- coding: utf-8 -*-
"""Caza el ReferenceError de zona muerta temporal ANTES de desplegarlo.

   EL BUG QUE LO TRAJO (24 sep 2026). En `components/AtlasSignal.tsx` el cuerpo
   de un `useEffect` hacia esto:

       function medir() { ...; pinta() }
       medir()                      // <-- se ejecuta AQUI
       ...
       let amp = ...                // <-- y `pinta()` lee esto, declarado DESPUES
       function pinta() { ...amp... }

   Las declaraciones de funcion SI se elevan; `let` y `const` NO. Asi que
   `medir()` corria, llamaba a `pinta()`, y `pinta()` tocaba `amp` estando en su
   zona muerta: ReferenceError, componente reventado, pantalla en blanco con
   «se ha producido una excepcion en el lado del cliente».

   No lo caza NADA de lo que hay: ni el balance de llaves, ni los detectores de
   JSX, ni `ignoreBuildErrors` —que tapa errores de tipo, no de ejecucion—, ni
   TypeScript, que este caso concreto no lo ve. Y sin Node no hay forma de
   ejecutarlo. Por eso existe esto.

   QUE BUSCA. Dentro de cada bloque: una llamada `f()` a nivel del bloque,
   siendo `f` una funcion declarada en ese mismo bloque, que lea —directa o
   indirectamente— una variable `let`/`const` declarada MAS ABAJO que la
   llamada.

   ES UNA HEURISTICA, no un interprete: no sigue el flujo real ni entiende
   ambitos anidados con precision. Por eso imprime el porque de cada aviso, para
   que quien lo lea pueda juzgarlo.
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

RX_FUNC = re.compile(r'^(\s*)function\s+([A-Za-z_$][\w$]*)\s*\(')
RX_DECL = re.compile(r'^(\s*)(?:let|const)\s+([A-Za-z_$][\w$]*)\s*=')
RX_LLAM = re.compile(r'^(\s*)([A-Za-z_$][\w$]*)\(\s*\)\s*$')


def cuerpo_de(lineas, inicio, sangria):
    """Las líneas de una función que empieza en `inicio`, por profundidad."""
    prof, out = 0, []
    for i in range(inicio, len(lineas)):
        l = lineas[i]
        out.append(l)
        prof += l.count('{') - l.count('}')
        if prof <= 0 and i > inicio:
            break
    return out


def revisar(ruta):
    txt = io.open(ruta, encoding='utf-8-sig').read()
    L = txt.split('\n')

    # Funciones declaradas: nombre -> (línea, sangría, cuerpo)
    funcs = {}
    for i, l in enumerate(L):
        m = RX_FUNC.match(l)
        if m:
            funcs[m.group(2)] = (i, len(m.group(1)), cuerpo_de(L, i, len(m.group(1))))

    # Declaraciones let/const: nombre -> (línea, sangría).
    #
    # SOLO importan las del MISMO nivel de bloque que la llamada. La primera
    # versión metía también las locales de cada función —`grad`, `medio`, `u`…—
    # y sacaba diez falsos positivos por cada acierto: una variable declarada
    # DENTRO de `pinta()` no está en zona muerta cuando `pinta()` se ejecuta,
    # se crea en ese momento. Un detector con esa proporción de ruido no lo
    # mira nadie, y un detector que nadie mira no protege de nada.
    decls = {}
    for i, l in enumerate(L):
        m = RX_DECL.match(l)
        if m and m.group(2) not in decls:
            decls[m.group(2)] = (i, len(m.group(1)))

    def lee(nombre_func, vistos=None):
        """Qué variables lee una función, siguiendo las que llama."""
        vistos = vistos or set()
        if nombre_func in vistos or nombre_func not in funcs:
            return set()
        vistos.add(nombre_func)
        cuerpo = '\n'.join(funcs[nombre_func][2])
        usadas = set(re.findall(r'(?<![.\w$])([A-Za-z_$][\w$]*)', cuerpo))
        out = usadas & set(decls)
        for otra in usadas & set(funcs):
            if otra != nombre_func:
                out |= lee(otra, vistos)
        return out

    avisos = []
    for i, l in enumerate(L):
        m = RX_LLAM.match(l)
        if not m:
            continue
        nombre = m.group(2)
        if nombre not in funcs:
            continue
        # Palabras que parecen llamada pero no lo son
        if nombre in ('return', 'if', 'while', 'for', 'switch', 'catch'):
            continue
        sangria_llamada = len(m.group(1))
        for var in sorted(lee(nombre)):
            linea_decl, sangria_decl = decls[var]
            # Misma sangria = mismo bloque. Si la declaracion esta mas adentro,
            # es local de otra funcion y no hay zona muerta que valga.
            if sangria_decl == sangria_llamada and linea_decl > i:
                avisos.append((i + 1, nombre, var, linea_decl + 1))
    return avisos


def main():
    total, revisados = 0, 0
    for base, dirs, ficheros in os.walk(RAIZ):
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.next', '.git', 'scripts')]
        for f in sorted(ficheros):
            if not f.endswith(('.ts', '.tsx')):
                continue
            ruta = os.path.join(base, f)
            rel = os.path.relpath(ruta, RAIZ).replace('\\', '/')
            revisados += 1
            for linea, func, var, decl in revisar(ruta):
                print('  %s:%d' % (rel, linea))
                print('     se llama a `%s()` aqui, y lee `%s`,' % (func, var))
                print('     que no se declara hasta la linea %d -> ReferenceError.' % decl)
                print()
                total += 1

    print('  %d archivo(s) revisados.' % revisados)
    if total == 0:
        print('  ninguna llamada antes de que exista lo que lee.')
        return 0
    print('  *** %d llamada(s) en zona muerta temporal. ***' % total)
    print('  Arreglo: subir la declaracion `let`/`const` por encima de la llamada.')
    return 1


if __name__ == '__main__':
    sys.exit(main())
