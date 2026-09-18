# -*- coding: utf-8 -*-
"""Caza comentarios `{/* ... */}` puestos donde JSX no los admite.

   POR QUE EXISTE
   --------------
   En esta maquina no hay Node: no se puede correr `next build` ni `tsc`, y
   `next.config.js` trae `typescript: { ignoreBuildErrors: true }`, que ademas
   solo tapa errores de TIPO — un error de SINTAXIS revienta el build igual.

   El 18 de septiembre de 2026 eso tumbo dos despliegues de produccion. La
   causa fueron cinco comentarios `{/* */}` colocados en dos sitios invalidos:

     <button onClick={...}
       {/* comentario */}          <- POSICION DE ATRIBUTO: invalido
       style={{...}}>

     return (
       {/* comentario */}          <- JUSTO TRAS `return (`: invalido
       <div>...

   `{/* */}` solo vale entre HIJOS de un elemento. En cualquier otro sitio va
   un comentario normal de JavaScript, `/* */`, encima de la expresion.

   USO
   ---
       python scripts/revisa-jsx.py            # revisa app/ y components/
       python scripts/revisa-jsx.py ruta.tsx   # revisa lo que le digas

   Sale con codigo 1 si encuentra algo, para poder encadenarlo antes de un
   commit.
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Una linea que abre etiqueta JSX: `<div`, `<Tooltip`, `<CustomSelect`...
RX_ABRE_TAG = re.compile(r'<[A-Za-z][\w.]*')


def lineas_utiles(lineas, hasta):
    """Indices de lineas no vacias antes de `hasta`, de la mas cercana atras."""
    for j in range(hasta - 1, -1, -1):
        if lineas[j].strip():
            yield j


def en_posicion_de_atributo(lineas, i):
    """True si la linea `i` cae DENTRO de una etiqueta JSX sin cerrar.

    Se retrocede buscando la apertura de etiqueta mas cercana; si entre esa
    apertura y nuestra linea no aparecio un `>` que la cierre, estamos en la
    zona de atributos y `{/* */}` es invalido ahi.
    """
    for j in lineas_utiles(lineas, i):
        # Se quitan las expresiones `{...}` ANTES de mirar nada: un `>` o una
        # etiqueta que viven dentro de llaves —`{tab === 'x' && <Foo />}`— son
        # un HIJO ya cerrado, no la etiqueta que nos envuelve. Mirar la linea
        # entera daba falsos positivos justo en ese caso.
        s = re.sub(r'\{[^{}]*\}', '', lineas[j])
        if '>' in s:
            return False          # habia una etiqueta y ya cerro
        if RX_ABRE_TAG.search(s):
            return True           # etiqueta abierta y sin cerrar: atributos
        # Linea de atributo suelta (`disabled`, `style=`): se sigue subiendo.
        # Si aparece codigo que no es JSX, ya no estamos en una etiqueta.
        if re.search(r'\b(return|const|let|function|if|for)\b', s):
            return False
    return False


def revisa(ruta):
    texto = io.open(ruta, encoding='utf-8').read()
    lineas = texto.split('\n')
    malos = []
    for i, ln in enumerate(lineas):
        if '{/*' not in ln:
            continue
        previas = list(lineas_utiles(lineas, i))
        anterior = lineas[previas[0]].rstrip() if previas else ''

        if anterior.endswith('return ('):
            malos.append((i + 1, 'va justo despues de `return (`'))
        elif en_posicion_de_atributo(lineas, i):
            malos.append((i + 1, 'va en posicion de ATRIBUTO, dentro de una etiqueta sin cerrar'))
    return malos


def recorre(base):
    for dirpath, dirnames, nombres in os.walk(base):
        dirnames[:] = [d for d in dirnames if d not in ('node_modules', '.next', '.git')]
        for n in nombres:
            if n.endswith('.tsx') or n.endswith('.jsx'):
                yield os.path.join(dirpath, n)


objetivos = sys.argv[1:]
if objetivos:
    archivos = []
    for o in objetivos:
        p = o if os.path.isabs(o) else os.path.join(RAIZ, o)
        archivos.extend(recorre(p) if os.path.isdir(p) else [p])
else:
    archivos = list(recorre(os.path.join(RAIZ, 'app'))) + list(recorre(os.path.join(RAIZ, 'components')))

total = 0
for a in sorted(archivos):
    for linea, motivo in revisa(a):
        try:
            rel = os.path.relpath(a, RAIZ).replace('\\', '/')
        except ValueError:
            rel = a.replace('\\', '/')   # otra unidad: relpath no puede
        print('  %s:%d  %s' % (rel, linea, motivo))
        total += 1

print()
if total:
    print('  %d comentario(s) JSX en posicion invalida — ESTO TUMBA EL BUILD.' % total)
    print('  Arreglo: sacar el `{/* */}` a un comentario normal `/* */` encima')
    print('  de la expresion, o moverlo a la zona de HIJOS del elemento.')
    raise SystemExit(1)
print('  %d archivo(s) revisados, ningun comentario JSX mal puesto.' % len(archivos))
